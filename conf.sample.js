var config = {}

config.username = "my_user";
config.pass = "my_password";
// "tcp://<username>:<pass>@<hostname>/<dbname>";
config.pg_config = "tcp://<username>:<pass>@<hostname>/<dbname>";
/*
{
    userName: 'nodebot',
    realName: 'nodeJS IRC client',
    port: 6667,
    debug: false,
    showErrors: false,
    autoRejoin: true,
    autoConnect: true,
    channels: [],
    secure: false,
    selfSigned: false,
    certExpired: false,
    floodProtection: false,
    floodProtectionDelay: 1000,
    stripColors: false,
    channelPrefixes: "&#",
    messageSplit: 512
}
*/
config.servers =  [
	{"server":"chat.freenode.net",
	 "nickname":"n00b_user",
	 "options":{
		 "autoRejoin":true,
	    "userName": "n00b_user",
	    "realName": "n00b user",
		 "channels":["#clevercloud","#privateChan chan_pass"]
	 }
	}
];
config.highlightwords = ["clever","cloud","node"];

module.exports = config;