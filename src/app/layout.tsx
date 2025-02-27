import '../app/globals.css';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'Landslide Detection',
  description: 'Landslide Detection',
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <head>
        <meta name="description" content={metadata.description} />
        <title>{metadata.title}</title>
      </head>
      <body className="bg-[#FFFFFF] dark:bg-[#111111]">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
};

export default Layout;
