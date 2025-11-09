import fs from "fs";
import https from "https";

export function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);

        const follow = (targetUrl) => {
            https.get(targetUrl, (res) => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    const redirectUrl = new URL(res.headers.location, targetUrl).toString();
                    res.destroy();
                    follow(redirectUrl);
                    return;
                };

                if (res.statusCode !== 200) {
                    reject(new Error(`HTTP ${res.statusCode} while fetching ${targetUrl}`));
                    return;
                };

                res.pipe(file);
                file.on("finish", () => {
                    file.close(resolve);
                });
            }).on("error", (err) => {
                fs.unlink(dest, () => reject(err));
            });
        };

        follow(url);
    });
};