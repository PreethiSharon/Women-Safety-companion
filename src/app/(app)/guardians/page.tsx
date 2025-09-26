import { GuardiansClient } from '@/components/guardians-client';
import { initialGuardians } from '@/lib/data';

export default function GuardiansPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-6">Guardian Network</h1>
      <GuardiansClient initialGuardians={initialGuardians} />
    </div>
  );
}
