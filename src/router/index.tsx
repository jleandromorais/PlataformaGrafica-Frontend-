import { createBrowserRouter } from "react-router-dom";
import { Layout } from "../components/layout/Layout";
import DashboardPage from "../pages/Dashboard";
import PMPVPage from "../pages/PMPV";
import CGFPage from "../pages/CGF";
import AuditoriaPage from "../pages/Auditoria";
import ConciliacaoPage from "../pages/Conciliacao";
import RETPage from "../pages/RET";
import PRPage from "../pages/PR";
import PVPage from "../pages/PV";
import RPVPage from "../pages/RPV";
import SCGPage from "../pages/SCG";
import SRPage from "../pages/SR";
import ExcelFinalPage from "../pages/ExcelFinal";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true,        element: <DashboardPage /> },
      { path: "pmpv",       element: <PMPVPage /> },
      { path: "cgf",        element: <CGFPage /> },
      { path: "auditoria",  element: <AuditoriaPage /> },
      { path: "conciliacao",element: <ConciliacaoPage /> },
      { path: "ret",        element: <RETPage /> },
      { path: "pr",         element: <PRPage /> },
      { path: "pv",         element: <PVPage /> },
      { path: "rpv",        element: <RPVPage /> },
      { path: "scg",        element: <SCGPage /> },
      { path: "sr",         element: <SRPage /> },
      { path: "excel-final", element: <ExcelFinalPage /> },
    ],
  },
]);
