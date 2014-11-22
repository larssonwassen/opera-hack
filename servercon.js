var request = null;
var messageXHR = null;
var localName;
var server;
var my_id = -1;
var other_peers = {};
var message_counter = 0;

function trace(txt) {
  var elem = document.getElementById("debug");
  elem.innerHTML += txt + "<br>";
}

function handleServerNotification(data) {
  console.log('Server notification with data: '+ data);
  trace("Server notification: " + data);
  var parsed = data.split(',');
  if (parseInt(parsed[2]) != 0)
    other_peers[parseInt(parsed[1])] = parsed[0];
}

function handlePeerMessage(peer_id, data) {
  console.log("handle message with data: "+ data);
  var str = "Message from '" + other_peers[peer_id] + ": meassage " + data +"&nbsp;";

  trace(str);
  if (document.getElementById("loopback").checked) {
    if (data.search("offer") != -1) {
      // In loopback mode, replace the offer with an answer.
      data = data.replace("offer", "answer");
      // Keep only the first crypto line for each m line in the answer.
      sendToPeer(peer_id, data);
    }
    
  }
}

function GetIntHeader(r, name) {
  var val = r.getResponseHeader(name);
  return val != null && val.length ? parseInt(val) : -1;
}

function gotMessageCallback() {
  try {
    if (messageXHR.readyState != 4)
      return;
    if (messageXHR.status != 200) {
      trace("server error: " + messageXHR.statusText);
      disconnect();
    } else {
      var peer_id = GetIntHeader(messageXHR, "Pragma");
      console.log(messageXHR.response);
      console.log(messageXHR);
      if (peer_id == my_id) {
        handleServerNotification(messageXHR.response);
      } else {
        handlePeerMessage(peer_id, messageXHR.response);
      }
    }

    if (messageXHR) {
      messageXHR.abort();
      messageXHR = null;
    }

    if (my_id != -1)
      window.setTimeout(startListeningForMessages, 0);
  } catch (e) {
    trace("Hanging get error: " + e.description);
  }
}

function startListeningForMessages() {
  try {
    messageXHR = new XMLHttpRequest();
    messageXHR.onreadystatechange = gotMessageCallback;
    messageXHR.ontimeout = onMessageGetTimeout;
    messageXHR.open("GET", server + "/wait?peer_id=" + my_id, true);
    messageXHR.send();  
  } catch (e) {
    trace("error" + e.description);
  }
}

function onMessageGetTimeout() {
  trace("Timeout. issuing again.");
  messageXHR.abort();
  messageXHR = null;
  if (my_id != -1)
    window.setTimeout(startListeningForMessages, 0);
}

function signInCallback() {
  try {
    if (request.readyState == 4) {
      if (request.status == 200) {
        var peers = request.responseText.split("\n");
        my_id = parseInt(peers[0].split(',')[1]);
        trace("My id: " + my_id);
        console.log(peers);
        for (var i = 1; i < peers.length; ++i) {
          if (peers[i].length > 0) {
            trace("Peer nr" + i + " is: " + peers[i]);
            
            var parsed = peers[i].split(',');
            other_peers[parseInt(parsed[1])] = parsed[0];
          }
        }
        startListeningForMessages();
        request = null;
      }
    }
  } catch (e) {
    trace("error: " + e.description);
  }
}

function signIn() {
  try {
    request = new XMLHttpRequest();
    request.onreadystatechange = signInCallback;
    request.open("GET", server + "/sign_in?" + localName, true);
    request.send();
  } catch (e) {
    trace("error: " + e.description);
  }
}

function sendToPeer(peer_id, data) {
  if (my_id == -1) {
    alert("Not connected");
    return;
  }
  if (peer_id == my_id) {
    alert("Can't send a message to oneself :)");
    return;
  }
  var r = new XMLHttpRequest();
  r.open("POST", server + "/messageA?peer_id=" + my_id + "&to=" + peer_id,
         false);
  r.setRequestHeader("Content-Type", "text/plain");
  r.send(data);
  r = null;
}

function connect() {
  localName = document.getElementById("local").value.toLowerCase();
  server = document.getElementById("server").value.toLowerCase();
  if (localName.length == 0) {
    alert("I need a name please.");
    document.getElementById("local").focus();
  } else {
    document.getElementById("connect").disabled = true;
    document.getElementById("disconnect").disabled = false;
    document.getElementById("send").disabled = false;
    signIn();
  }
}

function disconnect() {
  if (request) {
    request.abort();
    request = null;
  }
  
  if (hangingGet) {
    hangingGet.abort();
    hangingGet = null;
  }

  if (my_id != -1) {
    request = new XMLHttpRequest();
    request.open("GET", server + "/sign_out?peer_id=" + my_id, false);
    request.send();
    request = null;
    my_id = -1;
  }

  document.getElementById("connect").disabled = false;
  document.getElementById("disconnect").disabled = true;
  document.getElementById("send").disabled = true;
}

window.onbeforeunload = disconnect;

function send() {
  var text = document.getElementById("message").value;
  var peer_id = parseInt(document.getElementById("peer_id").value);
  if (!text.length || peer_id == 0) {
    alert("No text supplied or invalid peer id");
  } else {
    sendToPeer(peer_id, text);
  }
}

function toggleMe(obj) {
  var id = obj.id.replace("toggle", "msg");
  var t = document.getElementById(id);
  if (obj.innerText == "+") {
    obj.innerText = "-";
    t.style.display = "block";
  } else {
    obj.innerText = "+";
    t.style.display = "none";
  }
}