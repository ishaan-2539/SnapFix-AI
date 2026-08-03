import { useOutletContext } from "react-router-dom";
import CityMap from "@/pages/CityMap";

export default function OpsMap() {
  const { openMobileMenu } = useOutletContext<{ openMobileMenu: () => void }>();
  return (
    <CityMap
      standalone={false}
      reportPath="/app/report"
      detailsBasePath="/ops/reports"
      onMenuClick={openMobileMenu}
    />
  );
}