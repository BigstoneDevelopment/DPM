import https from "https";

export async function fetchDpmConfig(url) {
    return new Promise((resolve) => {
        https
            .get(url, (res) => {
                if (res.statusCode !== 200) return resolve(null);

                let data = "";
                res.on("data", (chunk) => (data += chunk));
                res.on("end", () => {
                    try {
                        const parsed = JSON.parse(data);
                        resolve(parsed);
                    } catch {
                        resolve(null);
                    }
                });
            })
            .on("error", () => resolve(null));
    });
};