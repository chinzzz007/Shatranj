import { registerAs } from "@nestjs/config";

export const CONFIG_JWT_SECRET = "Jwt_Secret";

export default registerAs(CONFIG_JWT_SECRET, ()=>({
    secret: process.env.JWT_SECRET
}))
