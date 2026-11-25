import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { roleLabel } from '../../../shared/roles';
import type { Application, AuditEntry, ReviewKey } from '../../../shared/types';
import { REVIEW_KEYS, STAFF_ROLES } from '../../../shared/types';
import { applicationInputSchema, fundSchema, reportSchema, reviewSchema } from '../../../shared/validation';
import * as wf from '../../../shared/workflow';
import { HttpError, requireActor } from '../auth';
import type { Ctx } from '../app';
import {
  getApplication,
  getInvestor,
  insertApplication,
  listApplications,
  listAudit,
  listInvestors,
  nextNumber,
  pickManager,
  saveApplication,
  writeAudit,
} from '../repo';

const idParam = z.object({ id: z.string().min(1).max(40) });
const now = () => new Date().toISOString();

export async function applicationRoutes(app: FastifyInstance, { db }: Ctx) {
  /**
   * Ariza ustida bitta o'tish: qatorni qulflab o'qish → huquq va qoidani tekshirish →
   * saqlash → audit yozuvi. Hammasi bitta tranzaksiyada.
   */
  async function mutate(id: string, actor: wf.Actor, fn: (a: Application, tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => Promise<wf.Change> | wf.Change) {
    return db.transaction(async (tx) => {
      const before = await getApplication(tx, id, true);
      // Ko'rish huquqi bo'lmasa — mavjudligini ham oshkor qilmaymiz
      if (!before || !wf.canView(actor, before)) throw new HttpError(404, 'Ariza topilmadi');
      const { app: after, action } = await fn(before, tx);
      await saveApplication(tx, before, after, actor);
      await writeAudit(tx, actor, action, id);
      return wf.redact(actor, after);
    });
  }

  app.get('/api/applications', async (req) => {
    const actor = requireActor(req);
    const apps = await listApplications(db, actor);
    return { applications: apps.map((a) => wf.redact(actor, a)) };
  });

  app.get('/api/applications/:id', async (req) => {
    const actor = requireActor(req);
    const { id } = idParam.parse(req.params);
    const a = await getApplication(db, id);
    if (!a || !wf.canView(actor, a)) throw new HttpError(404, 'Ariza topilmadi');
    const staff = wf.isStaff(actor.role);
    const history: AuditEntry[] = (await listAudit(db, { target: id })).map((e) =>
      // Tashqi foydalanuvchiga xodim ismi emas, faqat organ nomi ko'rsatiladi
      staff || e.role === actor.role ? e : { ...e, user: roleLabel(e.role) },
    );
    return { application: wf.redact(actor, a), history };
  });

  app.post('/api/applications', async (req, reply) => {
    const actor = requireActor(req, ['admin', 'menejer', 'biznes']);
    const input = applicationInputSchema.parse(req.body);
    // Biznes faqat o'z kompaniyasi nomidan ariza beradi
    if (actor.role === 'biznes') input.company = actor.name;
    const created = await db.transaction(async (tx) => {
      const year = new Date().getFullYear();
      const n = await nextNumber(tx, `application:${year}`);
      const manager = actor.role === 'menejer' ? { id: actor.id, name: actor.name } : await pickManager(tx);
      const { app: a, action } = wf.create(input, actor, wf.formatApplicationId(year, n), manager, now());
      await insertApplication(tx, a);
      await writeAudit(tx, actor, action, a.id);
      return a;
    });
    reply.code(201);
    return { application: wf.redact(actor, created) };
  });

  app.put('/api/applications/:id', async (req) => {
    const actor = requireActor(req);
    const { id } = idParam.parse(req.params);
    const input = applicationInputSchema.parse(req.body);
    return { application: await mutate(id, actor, (a) => wf.edit(a, input, actor)) };
  });

  app.post('/api/applications/:id/submit', async (req) => {
    const actor = requireActor(req);
    const { id } = idParam.parse(req.params);
    return { application: await mutate(id, actor, (a) => wf.submit(a, actor)) };
  });

  app.post('/api/applications/:id/reviews/:key', async (req) => {
    const actor = requireActor(req, ['admin', 'komplayens', 'investitsiya', 'yuridik']);
    const { id, key } = idParam.extend({ key: z.enum(REVIEW_KEYS as [ReviewKey, ...ReviewKey[]]) }).parse(req.params);
    const { status, comment } = reviewSchema.parse(req.body ?? {});
    return { application: await mutate(id, actor, (a) => wf.review(a, key, status, comment, actor, now())) };
  });

  app.post('/api/applications/:id/fund', async (req) => {
    const actor = requireActor(req, ['admin', 'menejer']);
    const { id } = idParam.parse(req.params);
    const { investorId } = fundSchema.parse(req.body);
    return {
      application: await mutate(id, actor, async (a, tx) => {
        const investor = await getInvestor(tx, investorId);
        if (!investor) throw new HttpError(400, 'Investor topilmadi');
        if (a.stage !== 'imzolash') return wf.fund(a, investor, '', actor, now()); // xato qaytaradi, raqam band qilinmaydi
        const year = new Date().getFullYear();
        const agreementNo = wf.formatAgreementNo(year, await nextNumber(tx, `agreement:${year}`));
        return wf.fund(a, investor, agreementNo, actor, now());
      }),
    };
  });

  app.post('/api/applications/:id/complete', async (req) => {
    const actor = requireActor(req, ['admin', 'menejer']);
    const { id } = idParam.parse(req.params);
    return { application: await mutate(id, actor, (a) => wf.complete(a, actor)) };
  });

  app.post('/api/applications/:id/reports', async (req) => {
    const actor = requireActor(req, ['admin', 'menejer', 'biznes']);
    const { id } = idParam.parse(req.params);
    const report = reportSchema.parse(req.body);
    return { application: await mutate(id, actor, (a) => wf.addReport(a, report, actor)) };
  });

  app.get('/api/investors', async (req) => {
    requireActor(req, STAFF_ROLES);
    return { investors: await listInvestors(db) };
  });

  app.get('/api/audit', async (req) => {
    const actor = requireActor(req);
    // Bosh sahifadagi "so'nggi harakatlar" uchun xodimlar oxirgi yozuvlarni ko'radi; to'liq jurnal — admin va audit
    const full = actor.role === 'admin' || actor.role === 'audit';
    if (!full && !wf.isStaff(actor.role)) throw new HttpError(403, "Bu bo'limga kirish huquqingiz yo'q");
    return { audit: await listAudit(db, { limit: full ? 500 : 10 }) };
  });
}
