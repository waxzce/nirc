**Curently instable, be back in just a few weeks or watch http://blog.clever-cloud.com**

#Intro
nirc (node irc) is an irc client. Main features are :
* always connected 
* store hostory 
* web based

All the messages are stored into a postgre database 

#Setup

	cp conf.sample.js conf.js

write your own conf

execute the init.sql file into your pg database

	npm install
	node app.js

or deploy it on the http://www.clever-cloud.com with just a git push :-)


#TODO
* display notification message
* display members of the chan
* allow to connect to password protected chan
* allow PM
