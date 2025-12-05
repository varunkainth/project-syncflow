import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import * as uploadController from "./controller";

const upload = new OpenAPIHono();

// We use standard Hono route for file upload as OpenAPI definition for multipart/form-data 
// with Zod is complex and often requires workarounds.
// And since we handle file parsing manually in the controller.
upload.post("/", uploadController.uploadImage);

export default upload;
