const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { execFile } = require("node:child_process");

const PORT = 3000;
const PRINTER_NAME = "CanonSelphy";

const printFolder = path.join(__dirname, "prints");

if (!fs.existsSync(printFolder)) {
    fs.mkdirSync(printFolder);
}

const server = http.createServer((request, response) => {
    // page to contact server
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (request.method === "OPTIONS") {
        response.writeHead(204);
        response.end();
        return;
    }

    if (request.method !== "POST" || request.url !== "/print") {
        response.writeHead(404, {
            "Content-Type": "application/json"
        });

        response.end(JSON.stringify({
            success: false,
            message: "Not found"
        }));

        return;
    }

    let body = "";

    request.on("data", chunk => {
        body += chunk;

        // limit request sizes
        if (body.length > 30_000_000) {
            request.destroy();
        }
    });

    request.on("end", () => {
        try {
            const data = JSON.parse(body);

            if (!data.image) {
                throw new Error("No image was received.");
            }

            const base64Image = data.image.replace(
                /^data:image\/png;base64,/,
                ""
            );

            const fileName = `photobooth-${Date.now()}.png`;
            const filePath = path.join(printFolder, fileName);

            fs.writeFile(filePath, base64Image, "base64", error => {
                if (error) {
                    console.error("Could not save image:", error);

                    response.writeHead(500, {
                        "Content-Type": "application/json"
                    });

                    response.end(JSON.stringify({
                        success: false,
                        message: "The image could not be saved."
                    }));

                    return;
                }

                const printArguments = [
                    "-d",
                    PRINTER_NAME,
                    filePath
                ];

                execFile("lp", printArguments, (printError, stdout, stderr) => {
                    if (printError) {
                        console.error("Printing failed:", printError);
                        console.error(stderr);

                        response.writeHead(500, {
                            "Content-Type": "application/json"
                        });

                        response.end(JSON.stringify({
                            success: false,
                            message: stderr || "Printing failed."
                        }));

                        return;
                    }

                    console.log("Print job submitted:", stdout.trim());

                    response.writeHead(200, {
                        "Content-Type": "application/json"
                    });

                    response.end(JSON.stringify({
                        success: true,
                        message: stdout.trim()
                    }));
                });
            });
        } catch (error) {
            console.error(error);

            response.writeHead(400, {
                "Content-Type": "application/json"
            });

            response.end(JSON.stringify({
                success: false,
                message: error.message
            }));
        }
    });
});

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Print server running at http://localhost:${PORT}`);
    console.log(`Printer: ${PRINTER_NAME}`);
});