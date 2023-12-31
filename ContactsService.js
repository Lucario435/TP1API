import { createServer } from 'http';
import Repository from './repository.js';

function getPayload(req, res) {
    return new Promise(resolve => {
        let body = [];
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            let payload = null;
            if (body.length > 0)
                if (req.headers['content-type'] == "application/json")
                    try { resolve(JSON.parse(body)); }
                    catch (error) { console.log(error); }
            resolve(null);
        });
    })
}

function response(res, status, data = null) {
    if (data != null)
        res.writeHead(status, { 'Content-Type': 'application/json' });
    else
        res.writeHead(status);
    // request not handled
    res.end(data);
    return true;
}
async function handleContactsRequest(req, res) {
    let contactsRepository = new Repository("./contacts.json");
    let contact = null;
    if (req.url == "/api/contacts") {
        switch (req.method) {
            case "GET":
                return response(res, 200, JSON.stringify(contactsRepository.getAll()));
            case "POST":
                contact = await getPayload(req, res);
                if (contact != null) {
                    contact = contactsRepository.add(contact);
                    return response(res, 201, JSON.stringify(contact));
                } else
                    return response(res, 400);
            case "PUT":
                contact = await getPayload(req, res);
                if (contact != null)
                    if (contactsRepository.update(contact))
                        return response(res, 204);
                    else
                        return response(res, 404);
                else
                    return response(res, 400);
        }
    } else {
        if (req.url.includes("/api/contacts/")) {
            let id = parseInt(req.url.substring(req.url.lastIndexOf("/") + 1, req.url.length));
            switch (req.method) {
                case "GET":
                    let contact = contactsRepository.get(id);
                    if (contact !== null)
                        return response(res, 200, JSON.stringify(contact));
                    else
                        return response(res, 404);
                case "DELETE":
                    if (contactsRepository.remove(id))
                        return response(res, 202);
                    else
                        return response(res, 404);
            }
        }
    }
    return false;
}
//test
function allowAllAnonymousAccess(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Expose-Headers', '*');
}
function accessControlConfig(req, res) {
    if (req.headers['sec-fetch-mode'] == 'cors')
        allowAllAnonymousAccess(res);
}
function CORS_Preflight(req, res) {
    if (req.method === 'OPTIONS') {
        console.log('CORS preflight verifications');
        res.end();
        return true;
    }
}
const server = createServer(async (req, res) => {
    console.log(req.method);
    accessControlConfig(req, res);
    if (!CORS_Preflight(req, res))
        if (!handleContactsRequest(req, res))
            response(res, 404);
});
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
