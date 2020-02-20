const Discord = require('discord.js');
var auth = require('./auth.json');
const bot = new Discord.Client({ token: auth.token });
var sqlite3 = require('sqlite3').verbose();
let Raid = require('./raid.js');
let UserClass = require('./userclass.js');
const GoogleImages = require('google-images');
const client = new GoogleImages('004926251727705948840:xhe9drwd6di', 'AIzaSyDuKIWAiRUyEUcp0qn_c82sxOcmwZjy8Hg');

const botName = "FlexBot";
const botSayHello = false;
const version = "0.1";
const debugMode = true;
const prefix = '$f ';
var raid = null;
var authors = {
    flex : "FL3x#1337",
    riku : "Riku#1234"
};

// Not beeing used yet --> Move to database --> make configurable?
var roles = {
    raidLead : "<Discord-Rolle-Raidlead>",
    raidMember : "<Discord-Rolle-Raidmember>"
}

// Not beeing used yet  --> Move to database --> make configurable?
var channels = {
    botChannel : "<Discord-Bot-Channel>"
}

// Eastereggs (shhhh)
const brotCode = "<:bread:680073323220172807>";
const uwuCode = "<:uwu:680073353020964914>";
const eastereggsEnabled = true; 

var db = new sqlite3.Database('./db/data.db', (e) => {
  if (e) {
    console.error(e.message);
  }
  console.log(`${botName} successfully connected to the database`);
});

bot.on('ready', function (evt) {
    console.log(`${botName} successfully connected to discord`);
    console.log('Logged in as: ');
    console.log(bot.user.username + ' - (' + bot.user.id + ')');
    //bot.channels.find(c => c.name === "general").send("Hey There! It's me, FlexBox!");
    console.log(`${botName} is ready!`);
    console.log('---------------------------------------');
});
bot.login("NTA3ODQ0ODI1MjI0MDUyNzU2.XkPpbg.BDRj-QV8pF9VL6F08OF71O_-KV4");


bot.on("message", message => {
    if (message.content.substring(0, 3) == prefix) {
        var args = message.content.substring(3).split(' ');
        var cmd = args[0];  
        args = args.splice(1);
        switch(cmd) {
            case 'ping':
                message.channel.send("Pong!");
            break;
            case 'help':
                message.channel.send({embed: {
                    color: 3447003,
                    title: "Here all possible commands:",
                    fields: [
                        { name: "Command", value: "$f help\n$f classes\n$f me\n$f me add <short>\n$f me remove <short>\n$f raid\n$f raid open", inline: true},
                        { name: "Description", value: "Shows all possible commands\nShows all available classes\nShows your registered classes\nAdd a class\nRemove a class\nShows info about an open raid\nOpen a new raid", inline: true}
                    ]}
                });
            break;
            case 'classes':
                cmd_classes(message);
            break;
            case 'userclasses':
                cmd_userclasses(args, message);
            break;
            case 'me':
                cmd_me(args, message);
            break;
            case 'raid':
                cmd_raid(args, message);
            break;
            case 'easteregg':
                message.channel.send("https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcRhWMRJqt1B42E3VIoAj5-wwbC2YAVphy9uH9vFdU2N2OYk5TuW");
            break;
            case 'image':
            	cmd_image(args, message, null);
            break;
            case 'meme':
            	cmd_image(args, message, "meme");	
            break;
        }
    }

    // Troll Section, Feel free to add more :>
    if(eastereggsEnabled && !message.author.bot){
        if(message.content.toLowerCase().includes("brot")){
            message.channel.send(brotCode);
        } else if(message.content.toLowerCase().includes("lol")){
            message.channel.send("LOOOOL, hahahaha so lustig!! :'D");
        } else if(message.content.toLowerCase().includes("uwu")){
            message.channel.send(uwuCode); 
        } else if(message.content.toLowerCase().includes("❤️") || message.content.toLowerCase().includes("<3")){
            log(message.content);
            if(message.content.includes("<@!507844825224052756>") || message.content.toLowerCase().includes("flex")){
                message.channel.send("Danke!! Luv you too ❤️"); 
            } else {
                message.channel.send("Will auch etwas liebe 😥"); 
            }
            
        }
    }
});

function cmd_raid(args, message){
    if(args.length > 0){
        // Check for further args
        let cmd = args[0];
        if(cmd == 'open'){
            log(`Opening a new raid..`); 
            openRaid(message);
        } else {
            message.channel.send({embed: {
                color: 3447003,
                title: "Dein Command war ungültig. Verfügbare Commands:",
                fields: [
                    { name: "Command", value: "$f raid\n$f raid open", inline: true},
                    { name: "Description", value: "Zeigt den aktuell offenen Raid\nÖffnet einen neuen Raid. Achtung! Es gibt immer nur einen Raid; ein anderer offener Raid wird geschlossen!", inline: true}
                ]}
            });
        }
        
    } else {
       showOpenRaid(message);
    }
}


function openRaid(message){
    raid = new Raid(message.member.user);

    db.all('SELECT uc.id AS id, u.uid AS uid,u.name AS tag,u.nick AS nick, c.class, c.specialization AS spec, c.short AS short, c.role AS role '
                + 'FROM users AS u '
                + 'JOIN userclasses as uc ON u.id = uc.user '
                + 'JOIN classes AS c ON uc.class = c.id '
                + 'ORDER BY tag', function(err, rows){
        if (err) {
            log(err.message);
            message.channel.send("Derp. Irgendwas lief schief :(");
        }

        var numClass = 1;
        var numPlayer = 0;
        var tag = "";
        rows.forEach(function (row) {
            if(tag != row.tag){
                tag = row.tag;
                numClass = 1;
                numPlayer = numPlayer + 1;
            }
            let uc = new UserClass(numPlayer, numClass, row.id, row.uid, row.tag, row.nick, row.class, row.spec, row.short, row.role);
            raid.addAvailableMember(uc);   
            numClass = numClass + 1;     
        });

        log("Instantiated new raid with amount of available members: " + raid.availableMembersCount);
        var oldmsg = null;
        raid.status = 1;
        message.channel.send("Wann soll der Raid starten?").then(sentMessage => {
            oldmsg = sentMessage;
        })
        const collector = new Discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: 300000 });
        collector.on('collect', message => {
            switch(raid.status){
                case 1:
                    log(`Raid Status: 1 (Time) | Message: ${message.content}`);
                    raid.time = message.content;
                    raid.status = 2;
                    log("Deleting old question message");
                    oldmsg.delete();
                    message.channel.send("Welcher Wing?").then(sentMessage => {
                        oldmsg = sentMessage;
                    });
                    log("Deleting old answer message");
                    message.delete();
                break;
                case 2:
                    log(`Raid Status: 2 (Wing) | Message: ${message.content}`);
                    raid.wing = message.content;
                    raid.status = 3;
                    log("Deleting old question message");
                    oldmsg.delete();
                    message.channel.send("Beschreibung?").then(sentMessage => {
                        oldmsg = sentMessage;
                    });
                    log("Deleting old answer message");
                    message.delete();
                break;
                case 3:
                    log(`Raid Status: 3 (Description) | Message: ${message.content}`);
                    raid.desc = message.content;
                    raid.status = 4;
                    log("Deleting old question message");
                    oldmsg.delete();
                    log("Deleting old answer message");
                    message.delete();
                    collector.stop("done");
                break;
                default:
                break;
            }
        });

        collector.on('end', (collected, reason) => {
            log("Raid Status: 4 | Picking Members");
            if(reason != null){
                if(reason == "time"){
                    message.channel.send("Du hast zu lange gebraucht. Sorry, dein Raid wird neu geöffnet.");
                    openRaid();
                } else if(reason == "done"){
                    processRaidMembers(message);
                }
            }
        });
    });
}

function createEmbed(title, description, author){
	var userclassesEmbed = new Discord.RichEmbed()
        .setColor('#0099ff')
        .setTitle(title)
        .setURL('https://snowcrows.com/')
        .setAuthor(`${botName}`)
        .setDescription(description)
        .setThumbnail('https://i.imgur.com/wSTFkRM.png')
        .setTimestamp()
        .setFooter(`${botName} - v${version} - ${author}`, 'https://i.imgur.com/wSTFkRM.png');
    return userclassesEmbed;
}

function showAvailableUserClasses(message){
    if(raid == null){
        return;
    }

    if(raid.message == null && raid.availableMembersCount == 0){
        message.channel.send("Noone has registered a class yet.");
    } else {
    	var userclassesEmbed = createEmbed(
    		"Verfügbare Mitglieder/Klassen", 
    		"Hier die zur Auswahl stehenden Klassen!\nWähle sie, indem du die Spieler und Klassenzahl angibst.\n Bsp. 2.4",
    		authors.flex);

        let tag = "";
        let value = "";
        // List comes sorted by user tags
        raid.availableMembers.forEach(function (member) {
            // If the tag changes
            if(tag != member.tag){
                value = ""; // Reset value
                tag = member.tag; // change tag
                // go get all values for that member
                raid.availableMembers.forEach(function (m) {
                    if(m.tag == tag){
                        value += `(${m.numPlayer}.${m.numClass}) ${m.short} - ${m.role} ${m.spec}\n`;
                    }
                });

                userclassesEmbed.addField("__**" + tag + "**__", value);       
            } 
                    
        });

        // List selected
        var members = "";
        raid.members.forEach(function (m) {
            members += `${m.tag} - ${m.short} - ${m.role} ${m.spec}\n`;    
        });

        if(members == ""){
            members = "Keine Mitglieder gewählt";
        }

        userclassesEmbed.addField("__**Ausgewählte Mitglieder**__", members);   
        userclassesEmbed.addField("Du bist fertig?", 'Publiziere den Raid mit "$f raid publish"!');
        if(raid.message == null){
            // New message
            message.channel.send(userclassesEmbed).then(sentMessage => {
                raid.message = sentMessage;
            })
        } else {
            // Update old list
            raid.message.edit(userclassesEmbed);
        }
    }
}


function processRaidMembers(message){
    showAvailableUserClasses(message);
    const regex = RegExp("\\d\.\\d");
    const collector = new Discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: 300000 });
    collector.on('collect', message => {
        if(regex.test(message.content)){
            var nums = message.content.split(".");
            var numPlayer = nums[0];
            var numClass = nums[1];
            
            var member = null;
            raid.availableMembers.forEach(function(m) {
                if(m.numPlayer == numPlayer && m.numClass == numClass){
                    member = m;
                }
            });

            if(member == null){
                message.channel.send("Keine registrierte Benutzerklasse gefunden mit: " + message.content); 
            } else {

                // Moves member to selected
                log(`Moving '${member.tag} | ${member.short}' to selected`);
                raid.addMember(member); 

                // Removes all available members from that player
                log(`Removing all user classes of '${member.tag}'`);
                for(var i = raid.availableMembersCount -1; i >= 0; i--){
                    var m = raid.availableMembers[i];
                    if(member.uid == m.uid){
                        raid.removeAvailableMember(m);  
                    }
                }
                log("Updating Available user list..");
                showAvailableUserClasses(message); //Update embed
                log("Deleting input message..");
                message.delete();   //Delete input message    

            }
        }
    });
    collector.on('end', (collected, reason) => {
        console.log("coll ended");
    });
}

function showOpenRaid(message){
    if(raid != null){
        message.channel.send(`Info about open raid`); 
    } else {
        message.channel.send(`Something went wrong. No open raid could be found!`); 
    }
}


function cmd_userclasses(args, message){
    if(args > 0){
        showUserClassesFrom(args, message);
    } else {
        showAllUserClasses(message);
    }
}

function showAllUserClasses(message){
    log("showAllUserClasses()");
    db.all('SELECT uc.id AS id, u.uid AS uid,u.name AS tag,u.nick AS nick, c.class, c.specialization AS spec, c.short AS short, c.role AS role '
                + 'FROM users AS u '
                + 'JOIN userclasses as uc ON u.id = uc.user '
                + 'JOIN classes AS c ON uc.class = c.id '
                + 'ORDER BY tag', function(err, rows){
        if (err) {
            log(err.message);
            message.channel.send("Derp. Irgendwas lief schief :(");
        }

        var userclassesEmbed = createEmbed(
            "Verfügbare Mitglieder/Klassen", 
            "Hier alle derzeit registrierten Benutzerklassen.",
            authors.flex);

        var userclasses = [];

        // Get all users from DB and store them temporarely
        rows.forEach(function (row) {
            userclasses.push(new UserClass(0, 0, row.id, row.uid, row.tag, row.nick, row.class, row.spec, row.short, row.role));   
        });

        // Build and add data
        let tag = "";
        let value = "";
        // List comes sorted by user tags
        userclasses.forEach(function (ucl) {
            // If the tag changes
            if(tag != ucl.tag){
                value = ""; // Reset value
                tag = ucl.tag; // change tag
                // go get all values for that member
                userclasses.forEach(function (uc) {
                    if(uc.tag == tag){
                        value += `${uc.short} - ${uc.role} ${uc.spec}\n`;
                    }
                });
                // Add data to embed
                userclassesEmbed.addField("__**" + (tag == authors.flex ? tag + " (Top DPS)" : tag) + "**__", value);       
            } 
        });
               
        if(tag == ""){
            message.channel.send("Es wurden noch keine Benutzerklassen registriert.");
        } else {
            message.channel.send(userclassesEmbed);
        }  
    }); 
}

function showUserClassesFrom(user, message){
    log("showUserClassesFrom()");
    db.all('SELECT uc.id AS id, u.uid AS uid,u.name AS tag,u.nick AS nick, c.class, c.specialization AS spec, c.short AS short, c.role AS role '
                + 'FROM users AS u '
                + 'JOIN userclasses as uc ON u.id = uc.user '
                + 'JOIN classes AS c ON uc.class = c.id '
                + 'WHERE tag == ? OR nick == ?'
                + 'ORDER BY tag', [user,user], function(err, rows){
        if (err) {
            log(err.message);
            message.channel.send("Derp. Irgendwas lief schief :(");
        }

        var userclassesEmbed = createEmbed(
            `${user}'s registrierte Klassen`, 
            `Hier alle derzeit registrierten Benutzerklassen von ${user}.`,
            authors.flex);

        let tag = "";
        let value = "";

        rows.forEach(function (uc) {
            if(tag == ""){
                tag = uc.tag;
            }
            value += `${uc.short} - ${uc.role} ${uc.spec}\n`;
        });
        userclassesEmbed.addField("__**" + (tag == authors.flex ? tag + " (Top DPS)" : tag) + "**__", value);  
  
        if(tag == ""){
            message.channel.send("Es wurden noch keine Benutzerklassen registriert.");
        } else {
            message.channel.send(userclassesEmbed);
        }  
    }); 
}

function cmd_me(args, message){
    if(args.length > 0){
        let cmd = args[0];
        if(cmd == 'add' || cmd == 'remove'){
            if(args.length > 1){
                addOrRemoveUserClass(message.member.user, args[1].toUpperCase(), (cmd=='add' ? false : true), message);
            } else {
                message.channel.send({embed: {
                    color: 3447003,
                    title: "Dein Command ist ungültig. Bitte benutze '$f me add <Kürzel>':",
                    fields: [
                        { name: "Command", value: "$f me\n$f me add\n$f me remove", inline: true},
                        { name: "Beschreibung", value: "Zeigt deine registrierten Klassen\nfüge eine Klasse hinzu\nEntferne eine Klasse", inline: true}
                    ]}
                });
            }
        }
    } else {
        // Show User's classes
        db.all('SELECT u.uid AS uid,u.name AS tag,u.nick AS nick, c.class, c.specialization AS spec, c.short AS short, c.role AS role '
                + 'FROM users AS u '
                + 'JOIN userclasses as uc ON u.id = uc.user '
                + 'JOIN classes AS c ON uc.class = c.id '
                + 'WHERE u.uid = ?',[message.member.user.id], 
        function(err, rows){
            var uids = "";
            var tags = "";
            var nicks = "";
            var classes = "";
            var specs = "";
            var shorts = "";
            var roles = "";
            if (err) {
                log(err.message);
                message.channel.send("Etwas ist schiefgelaufen:(");
            }

            var userclassesEmbed = createEmbed(
            	`${message.member.user.username}'s verfügbare Klassen`,
                "Deine hinterlegten Klassen:",
                authors.flex);   

            if(rows.length == 0){
                userclassesEmbed.addField('Keine Klassen', 'Es wurden noch keine Klassen hinterlegt.')
                .addField('Wie hinterlege ich meine Klassen?', "Benutze den Command '$f me add <Kürzel>'. Die Kürzel findest du mit '$f classes'.")
            } else {
                rows.forEach(function (row) {
	                   uids += row.uid + "\n";
	                   tags +=  row.tag + "\n";
	                   nicks += row.nick + "\n";
	                   classes += row.class + "\n";
	                   specs += row.spec + "\n";
	                   shorts += row.short + "\n";
	                   roles += row.role + "\n";
                });
                userclassesEmbed.addField('Spezialisierung', specs, true)
                .addField('Rolle', roles, true)
                .addField('Kürzel', shorts, true)
               }

            message.channel.send(userclassesEmbed);
        });
    }
}


function createUserIfNull(user){
    log(`Checking if the user exists and create it if not: '${user.tag}'`);
    db.serialize(function() {
        log(`Searching for user '${user.tag}'...`);

        db.get("SELECT * FROM users WHERE uid = '" + user.id + "' LIMIT 1", function(err, row) {
            if(row == null){ 
                log("User doesn't exist yet. Creating...");
                db.run('INSERT INTO users(uid,name) VALUES(?,?)', [user.id,user.tag], function(err) {
                    if (err) {
                        log("Couldn't create user: " + err.message);
                    } else {
                        log(`User '${user.tag}' has been created.`);
                    } 
                });
            } else {
                log(`Found user '${user.tag}'. Returning true...`);
            }
        });
    });
}

function addOrRemoveUserClass(user, clas, remove, message){
    createUserIfNull(user);
    db.serialize(function() {
        db.get("SELECT * FROM classes WHERE short = ? LIMIT 1", [clas], function(err, row) {
            if(row == null){ 
                log(`Class '${clas}' doesn't exist!`);  
                message.channel.send(`Class '${clas}' doesn't exist! Use '$f classes' to see all classes!`); 
            } else {

                if(!remove){
                    
                    log("Checking if there are any userclasses assigned already...");
                    db.get("SELECT * FROM userclasses WHERE user = (SELECT id FROM users WHERE uid = ?) AND class = (SELECT id FROM classes WHERE short = ?) LIMIT 1", 
                        [user.id, clas], function(err, row) {
                        if(row == null){ 
                            log(`User ${user.tag} doesn't have the class '${clas} yet.' Adding...`);
                            db.run('INSERT INTO userclasses(user,class) VALUES((SELECT id FROM users WHERE uid = ?),(SELECT id FROM classes WHERE short = ?))', [user.id,clas], function(err) {
                                if (err) {
                                    log("Couldn't add userclass: " + err.message);
                                    message.channel.send(`Something went wrong!`); 
                                } else {
                                    log(`Class '${clas}' has been added to user '${user.tag}'.`);
                                    message.channel.send(`Added class '${clas}' to user '${user}'`); 
                                } 
                            });
                        } else {
                            log(`User '${user.tag}' already has the class '${clas}'`);
                            message.channel.send(`User '${user.tag}' already has the class '${clas}'`); 
                        }
                    });
                } else {

                    db.run('DELETE FROM userclasses WHERE user = (SELECT id FROM users WHERE uid = ?) AND class = (SELECT id FROM classes WHERE short = ?)', [user.id,clas], function(err) {
                        if (err) {
                            log("Couldn't remove Userclass: " + err.message);
                            message.channel.send(`Couldn't remove Userclass '${clas}' from user '${user}': ` + err.message); 
                        } else {
                            log(`Removed class '${clas}' from user '${user}'`);
                            message.channel.send(`Removed class '${clas}' from user '${user}'`); 
                        } 
                    });
                }
            }
        });
    });  
}


function cmd_classes(message){
    

    db.all('SELECT id, class, specialization, name, short, role FROM classes', function(err, rows){
        var ids = "";
        var classes = "";
        var specs = "";
        var names = "";
        var shorts = "";
        var roles = "";
        if (err) {
            console.error(err.message);
            message.channel.send("Something went wrong! :(");
        }

        rows.forEach(function (row) {
            ids += row.id + "\n";
            classes += row.class + "\n";
            specs +=  row.specialization + "\n";
            names += row.name + "\n";
            shorts += row.short + "\n";
            roles += row.role + "\n";
        });

        // inside a command, event listener, etc.
        var classesEmbed = createEmbed('Verfügbare Klassen', 'Alle verfügbaren Klassen. Tragt eure Klassen mit "$f me add <Kürzel>" ein.', authors.flex)
        .addField('Spezialisierung', specs, true)
        .addField('Rolle', roles, true)
        .addField('Kürzel', shorts, true);
        message.channel.send(classesEmbed);
    });
}




function cmd_image(args, message, opt){
	var max = 3;
 
    if(args.length > 0){
        var searchText = args.join(" ");
        if(opt != null){
        	searchText += " " + opt;
        }
        client.search(searchText)
        .then(images => {

        if(images.length == 0){
            message.channel.send("No images found!");
            return "";
        }

        if(images.length < 3){
            var max = images.length
        } 
        var imgNum = Math.floor((Math.random() * 3));        
            message.channel.send(images[imgNum].url);
        });
    }   
}


function log(message){
    if(debugMode){
        console.log(message);
    }
}


String.prototype.format = function () {
        var a = this;
        for (var k in arguments) {
            a = a.replace(new RegExp("\\{" + k + "\\}", 'g'), arguments[k]);
        }
        return a
    }

function areEqual(){
   var len = arguments.length;
   for (var i = 1; i< len; i++){
      if (arguments[i] === null || arguments[i] !== arguments[i-1] || arguments[i] == empty)
         return false;
   }
   return true;
}