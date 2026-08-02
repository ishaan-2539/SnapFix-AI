import CityMap from "@/pages/CityMap";

export default function OpsMap() {
  return <CityMap standalone={false} reportPath="/app/report" detailsBasePath="/ops/reports" />;
}
