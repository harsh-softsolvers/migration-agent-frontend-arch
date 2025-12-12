import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("upload-preview", "routes/upload-preview.tsx"),
  route("template-selection", "routes/template-selection.tsx"),
] satisfies RouteConfig;
