document.addEventListener("DOMContentLoaded", function () {
  // Use buttons to toggle between views
  document
    .querySelector("#inbox")
    .addEventListener("click", () => load_mailbox("inbox"));
  document
    .querySelector("#sent")
    .addEventListener("click", () => load_mailbox("sent"));
  document
    .querySelector("#archived")
    .addEventListener("click", () => load_mailbox("archive"));
  document.querySelector("#compose").addEventListener("click", compose_email);

  // By default, load the inbox
  load_mailbox("inbox");
});

function compose_email() {
  // Show compose view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#email-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";

  // Clear out composition fields
  document.querySelector("#compose-recipients").value = "";
  document.querySelector("#compose-subject").value = "";
  document.querySelector("#compose-body").value = "";

  // Send email
  document.querySelector("#compose-form").onsubmit = (event) => {
    event.preventDefault();
    send_email();
  };
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector("#emails-view").style.display = "block";
  document.querySelector("#compose-view").style.display = "none";
  document.querySelector("#email-view").style.display = "none";

  // Clear mailbox content
  document.querySelector("#emails-view").replaceChildren();

  // Show the mailbox name
  document.querySelector("#emails-view").innerHTML = `<h3>${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }</h3>`;

  load_emails(mailbox);
}

function load_emails(mailbox) {
  // Fetch emails
  fetch(`/emails/${mailbox}`)
    .then((response) => response.json())
    .then((data) => {
      // Create card for each email
      for (let i = 0; i < data.length; i++) {
        let email = document.createElement("div");
        email.innerHTML = `
          <h3 class="mb-2">${data[i]["subject"]}</h3>
          <p class="mb-2">${data[i]["sender"]}</p>
          <p class="mb-2 small">${data[i]["timestamp"]}</p>
        `;
        email.style.cursor = "pointer";
        if (data[i]["read"] === true) {
          email.style.backgroundColor = "lightgray";
        }
        email.classList.add("card", "p-3", "mb-2");
        email.onclick = () => {
          show_email(data[i]["id"], mailbox);
        };
        document.querySelector("#emails-view").append(email);
      }
    })
    .catch((error) => console.log(error));
}

function send_email() {
  const recipients = document.querySelector("#compose-recipients").value;
  const subject = document.querySelector("#compose-subject").value;
  const body = document.querySelector("#compose-body").value;

  fetch("/emails", {
    method: "POST",
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body,
    }),
  })
    .then((response) => response.json())
    .then((result) => console.log(result))
    .then(() => {
      load_mailbox("sent");
    })
    .catch((error) => console.log(error));
}

function show_email(id, mailbox) {
  // Show email view and hide all other views
  document.querySelector("#email-view").style.display = "block";
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "none";

  // Clear email content
  document.querySelector("#email-view").replaceChildren();

  fetch(`/emails/${id}`)
    .then((response) => response.json())
    .then((data) => {
      let email = document.createElement("div");
      let archiveButtonText = "Archive";
      if (data["archived"] === true) {
        archiveButtonText = "Unarchive";
      }
      email.innerHTML = `
        <p>From: <span class="font-weight-bold">${data["sender"]}</span></p>
        <p>To: <span class="font-weight-bold">${data["recipients"]}</span></p>
        <p>Subject: <span class="font-weight-bold">${data["subject"]}</span></p>
        <div class="bg-white p-3 card mb-3">
          <p>${data["body"]}</p>
        </div>  
        <p class="small font-weight-bold lh-sm">Sent on ${data["timestamp"]}</p>
        <div class="d-block" id="actions">
          <button class="btn btn-primary" id="reply">Reply</button>
          <button class="btn btn-dark" id="archive">${archiveButtonText}</button>
        </div>
      `;
      email.classList.add("card", "p-5", "bg-light");
      document.querySelector("#email-view").append(email);

      // Hide archive/unarchive/reply actions for sent mail
      if (mailbox === "sent") {
        document.querySelector("#actions").className = "d-none";
      }

      document.querySelector("#archive").onclick = () => {
        archive_email(id, data["archived"]);
      };

      document.querySelector("#reply").onclick = () => {
        reply_email(
          data["sender"],
          data["subject"],
          data["body"],
          data["timestamp"]
        );
      };
    })
    .catch((error) => console.log(error));

  read_email(id);
}

function read_email(id) {
  fetch(`/emails/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      read: true,
    }),
  }).catch((error) => console.log(error));
}

function archive_email(id, archived) {
  fetch(`emails/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      archived: !archived,
    }),
  })
    .then(() => {
      load_mailbox("inbox");
    })
    .catch((error) => console.log(error));
}

function reply_email(recipient, subject, body, timestamp) {
  // Show compose view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#email-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";

  // Pre-fill data
  let re = "";
  if (subject.slice(0, 3) !== "Re:") {
    re = "Re: ";
  }
  document.querySelector("#compose-recipients").value = recipient;
  document.querySelector("#compose-subject").value = re + subject;
  document.querySelector(
    "#compose-body"
  ).value = `On ${timestamp}, ${recipient} wrote: "${body}"`;

  // Send reply
  document.querySelector("#compose-form").onsubmit = (event) => {
    event.preventDefault();
    send_email();
  };
}
