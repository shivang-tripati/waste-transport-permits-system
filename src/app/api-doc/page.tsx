import { getApiDocs } from '@/lib/swagger';
import ReactSwagger from './react-swagger';

export default async function IndexPage() {
  const spec = await getApiDocs();
  return (
    <main style={{ padding: '20px', background: '#fff', minHeight: '100vh' }}>
      <section className="container">
        <ReactSwagger spec={spec} />
      </section>
    </main>
  );
}