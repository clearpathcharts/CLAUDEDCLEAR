import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { BriefPage } from "./pages/BriefPage";
import { ArchivePage } from "./pages/ArchivePage";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/brief/:date" element={<BriefPage />} />
        <Route path="/archive" element={<ArchivePage />} />
      </Routes>
    </Layout>
  );
}
