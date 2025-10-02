import "./globals.css";
import Providers from "./providers";
import Navbar from "./components/Navbar";

export const metadata = {
  title: "Student Records System",
  description: "Secure system with role-based dashboards",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navbar />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
