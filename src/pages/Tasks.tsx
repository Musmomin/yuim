import AppTable from '../components/AppTable';
import { Card, PageHeader } from '../components/ui';
import { ROLES } from '../data/mock';
import { tasksFor, useStore } from '../store';

export default function Tasks() {
  const { role, apps } = useStore();
  const tasks = tasksFor(role, apps);
  const label = ROLES.find((r) => r.id === role)?.label;
  return (
    <>
      <PageHeader title="Mening vazifalarim" subtitle={`${label} sifatida qaroringizni kutayotgan arizalar`} />
      <Card>
        <AppTable apps={tasks} empty="Hozircha sizdan harakat talab qilinmaydi" />
      </Card>
    </>
  );
}
