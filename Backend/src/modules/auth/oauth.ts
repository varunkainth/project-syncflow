export const getGoogleAuthURL = () => {
    const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    const options = {
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/auth/google/callback",
        client_id: process.env.GOOGLE_CLIENT_ID!,
        access_type: "offline",
        response_type: "code",
        prompt: "consent",
        scope: [
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/userinfo.email",
        ].join(" "),
    };
    const qs = new URLSearchParams(options);
    return `${rootUrl}?${qs.toString()}`;
};

interface GoogleUser {
    id: string;
    email: string;
    verified_email: boolean;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
    locale: string;
}

export const getGoogleUser = async (code: string) => {
    const tokenUrl = "https://oauth2.googleapis.com/token";
    const values = {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/auth/google/callback",
        grant_type: "authorization_code",
    };

    const res = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(values).toString(),
    });

    const { access_token, id_token } = await res.json() as any;

    const userRes = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`, {
        headers: { Authorization: `Bearer ${id_token}` },
    });

    return await userRes.json() as GoogleUser;
};

export const getGithubAuthURL = () => {
    const rootUrl = "https://github.com/login/oauth/authorize";
    const options = {
        client_id: process.env.GITHUB_CLIENT_ID!,
        redirect_uri: process.env.GITHUB_REDIRECT_URI || "http://localhost:3000/auth/github/callback",
        scope: "user:email",
    };
    const qs = new URLSearchParams(options);
    return `${rootUrl}?${qs.toString()}`;
};

export const getGithubUser = async (code: string) => {
    const tokenUrl = "https://github.com/login/oauth/access_token";
    const values = {
        client_id: process.env.GITHUB_CLIENT_ID!,
        client_secret: process.env.GITHUB_CLIENT_SECRET!,
        code,
    };

    const res = await fetch(tokenUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify(values),
    });

    const { access_token } = await res.json() as any;

    const userRes = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${access_token}` },
    });
    const user = await userRes.json() as any;

    // GitHub doesn't always return email in public profile, fetch it separately
    const emailRes = await fetch("https://api.github.com/user/emails", {
        headers: { Authorization: `Bearer ${access_token}` },
    });
    const emails = await emailRes.json() as any;
    const primaryEmail = emails.find((e: any) => e.primary)?.email || emails[0].email;

    return { ...user, email: primaryEmail };
};
