import GovNavbar from '@/components/layout/GovNavbar';
import GovFooter from '@/components/layout/GovFooter';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GovNavbar />
      <main id="main-content">{children}</main>
      <GovFooter />
    </>
  );
}
