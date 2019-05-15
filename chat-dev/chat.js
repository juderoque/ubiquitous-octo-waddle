$(document).ready(function() {
	let justStarted = true;
	let userid = Math.floor(Math.random() * 200000000); // I am very sorry
	$("#usernum").text("user #"+userid);
	var d = $("div.chats");
	var newest = 0;
	var newmsgs = "";
	$( "#sendbutton" ).click(function() {
		var data = $("input#sendarea").val();
		newest++;
		$.ajax({
			type: 'POST',
			url: 'process.php',
			data: {'purpose': 'send', 'message': data, 'userid': userid, 'msgid': newest} ,
			success: function(result) { console.log("success");}, // this rreturns some bullshit ok
			dataType: 'text',
			error: function(a, b, c) {
				console.log("error: "+c);
				console.log("status: "+a.status);
			}
		});
		$( "input#sendarea" ).val('');
		addMessage(userid, data, true);
	});

	$("input#sendarea").keypress(function (e) {
		if (e.which == 13) {
			$( "#sendbutton" ).click();
			return false;
		}
	});
	function updateChat() {
		d.scrollTop(d.prop("scrollHeight"));
		$.ajax({
			type: 'POST',
			url: 'process.php',
			data: {'purpose':'update'} ,
			success: function(result) { newmsgs = result.substring(1, result.length).split("\\n"); },
			dataType: 'text',
			error: function(a, b, c) {
				console.log("error: "+c);
				console.log("status: "+a.status);
			}
		});
		var curr;
		var msg;
		var usr;
		for(var x = 0; x < newmsgs.length - 1; x++) // the last bit is garbage
		{
			curr = newmsgs[x].split("`");
			usr = curr[0];
			msgid = curr[1];
			msg = curr[2];
			if(+usr != userid && +msgid > +newest)
			{
				if(!justStarted)
				{
					addMessage(usr, msg, false);
				}
				newest = +msgid;
			}
		}
		justStarted = false;

	};
	updateChat();
	setInterval(updateChat, 500);
	function addMessage(usr, msg, isUs)
	{
		if(isUs)
		{
			var $newdiv = $( "<div class='chats-right'></div>");
		}
		else
		{
			var $newdiv = $( "<div class='chats-left'></div>");
		}
		$newdiv.append($("<span class='msg-userid'>#"+usr+":</span><br>"));
		$newdiv.append($("<span>"+msg+"</span>"));
		$( "div.chats" ).append($("<br>"));
		$( "div.chats" ).append($newdiv);
	}
});
