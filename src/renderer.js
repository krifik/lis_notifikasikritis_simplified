const { ipcRenderer, shell } = require('electron')
const FSDB = require("file-system-db");
require('dotenv').config()
const path = require("path");
const audio = new Audio(path.join(__dirname, 'alarm.wav'));
const db = new FSDB("db.json", false);

renderData()

ipcRenderer.on('notif', (event, arg) => {
    arg = JSON.parse(arg)

    const notifs = db.all();

    let isNew = true

    if (notifs.length > 0) {
        notifs.forEach(item => {
            if (item.ID == arg.regis_id) {
                db.delete(item.ID)
                isNew = false;
            }
        })
    }

    
    if (isNew) {
        db.set(`${arg.regis_id}`, { "lno": arg.lno, "mrn": arg.mrn, "patient_name": arg.patient_name, "ward_id": arg.ward_id, "process_id": arg.process_id })
        createNotification(arg)
    }
    renderData()

})

function handlePatient(ID, ward_id) {
    openLink({ regis_id: ID, ward_id: ward_id })
};


function renderData() {
    const element = document.getElementById('notif-list');
    const notifs = db.all()

    if (notifs.length > 0) {
        audio.loop = true;
        audio.play();
    } else {
        audio.pause();
        ipcRenderer.send('hideWindow')
    }

    let li = notifs.map(item => {
        return `
        <li onclick="handlePatient(${item.ID}, ${item.data.ward_id})">
        <button class="list-pasien w-100" >
          <table class="w-100">
            <tr class="tr-btn">
              <td>${item.data.lno}</td>
              <td>${item.data.mrn}</td>
              <td>${item.data.patient_name}</td>
            </tr>
          </table>
        </button>
        </li>`;
    }).join('')

    if (li == '') {
        li = '<li><p class="no-patient">Tidak ada pasien kritis</p></li>'
    }
    element.innerHTML = li
}

function createNotification(data) {
    // send ipc to main
    ipcRenderer.send('showWindow')

    const notification = new Notification('Pasien Kritis', {
        body: data.patient_name,
        silent: true,
    })

    notification.onclick = () => {
        openLink(data)
    }
}

function openLink(data) {
    const url = `${process.env.LIS_URL}critical-view/${data.regis_id}?WID=${data.ward_id}`
    shell.openExternal(url);
}