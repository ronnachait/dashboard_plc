// types/chartjs-annotation.d.ts
import { ChartType, Plugin } from "chart.js";

declare module "chart.js" {
  interface PluginOptionsByType<TType extends keyof ChartTypeRegistry> {
    annotation?: any; // 👈 ใส่ type ละเอียดได้ แต่ใส่ any ก็ dev ต่อได้
  }
}

declare module "chartjs-plugin-annotation" {
  const annotation: Plugin<ChartType>;
  export default annotation;
}
