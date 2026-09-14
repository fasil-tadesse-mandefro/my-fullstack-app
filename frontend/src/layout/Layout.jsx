import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import "./Layout.css";

function Layout({ children }) {
  return (
    <div className="layout-wrapper">
      <Navbar />
      <main className="layout-main">{children}</main>
      <Footer />
    </div>
  );
}

export default Layout;
