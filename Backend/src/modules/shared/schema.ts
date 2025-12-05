import { z } from "zod";

export const encryptedSchema = z.object({
    data: z.string().describe("Encrypted payload"),
});
