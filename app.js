var http = require("http");
var fs = require("fs");
var qs = require('querystring');

var vehiclePlates = JSON.parse(fs.readFileSync(__dirname + "/vehicle-plates.json"));
var idx = 1;
vehiclePlates.forEach(vp => {
    vp.id = idx++;
});

http.createServer(function (req, res) {
    if (req.url === "/") {
        res.writeHead(200, { 'Content-Type': 'text/html' });

        fs.createReadStream(__dirname + "/index.html").pipe(res);
    } else if (req.url === "/api/vehicle_plates/cities") {
        console.log("Request to cities.")
        var cities = [];

        vehiclePlates.forEach(vp => {
            cities.push({ id: vp.id, text: vp.city });
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify(cities));
        res.end();
    } else if (req.url === "/api/vehicle_plates/findCityPlate") {
        console.log("request to city plate");
        var body = '';
        var result = "";

        req.on('data', function (data) {
            body += data;
            var params = qs.parse(body);

            vehiclePlates.forEach(vp => {
                if (vp.id == params.id) {
                    result = vp.plate_no;
                    return false;
                }
            });
            res.end(result);
        });
    } else if (req.url === "/video") {
        console.log("Request to video");

        const path = __dirname + "/Node.mp4";
        const staf = fs.statSync(path);
        const fileSize = staf.size;
        const range = req.headers.range;

        console.log("Size of video: " + fileSize);
        console.log("Range: ", range);

        if (range) {
            console.log("Response 206");

            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            console.log("Start: " + start);
            console.log("End: " + end);

            const chunkSize = (end - start) + 1;
            console.log("ChunkSize: " + chunkSize);

            const file = fs.createReadStream(path, { start, end });
            const head = {
                'Content-Range': `bytes ${start} - ${end}/${fileSize}`,
                'Accept-Range': "bytes",
                'Content-Length': chunkSize,
                'Content-Type': 'video/mp4'
            };

            res.writeHead(206, head);
            file.pipe(res);
        } else {
            console.log("Response 200");

            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4'
            };

            res.writeHead(200, head);
            fs.createReadStream(path).pipe(res);
        }

    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain-text' });
        res.end("Not found the page you request");
    }

}).listen(3000);

console.log("Listening on port 3000...");