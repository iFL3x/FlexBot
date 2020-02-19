const Discord = require('discord.js');
var auth = require('./auth.json');
var sqlite3 = require('sqlite3').verbose();

var dbhelper = require('./db/dbhelper.js');
let Raid = require('./raid.js');
let UserClass = require('./userclass.js');
var raid = null;
const bot = new Discord.Client({
    token: auth.token
});

const botName = "FlexBot";

const debugMode = true;

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

var prefix = '$f ';
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
            case 'me':
                cmd_me(args, message);
            break;
            case 'raid':
                cmd_raid(args, message);
            break;
            case 'easteregg':
                message.channel.send("https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcRhWMRJqt1B42E3VIoAj5-wwbC2YAVphy9uH9vFdU2N2OYk5TuW");
            break;
        }
    }

})

bot.login("NTA3ODQ0ODI1MjI0MDUyNzU2.XkPpbg.BDRj-QV8pF9VL6F08OF71O_-KV4");


function log(message){
    if(debugMode){
        console.log(message);
    }
}


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
                title: "Your command was invalid. Available commands are:",
                fields: [
                    { name: "Command", value: "$f raid\n$f raid open", inline: true},
                    { name: "Description", value: "Shows your currently open raid\nOpens a new raid. Careful! Only one raid can be open at the moment! This will close all open raids.", inline: true}
                ]}
            });
        }
        
    } else {
       showOpenRaid(message);
    }
}


function openRaid(message){
    raid = new Raid(message.member.user);

    db.all('SELECT uc.id AS id, u.uid AS uid,u.name AS tag,u.nick AS nick, c.class, c.name AS fullname, c.specialization AS spec, c.short AS short '
                + 'FROM users AS u '
                + 'JOIN userclasses as uc ON u.id = uc.user '
                + 'JOIN classes AS c ON uc.class = c.id '
                + 'ORDER BY tag', function(err, rows){
        if (err) {
            log(err.message);
            message.channel.send("Something went wrong! :(");
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
            let uc = new UserClass(numPlayer, numClass, row.id, row.uid, row.tag, row.nick, row.class, row.spec, row.short, row.fullname);
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



    /* Process

    1) Ask for time (free input)
    2) Show empty raid
    3) Show list of available userclasses
    4) Ask for number inputs

    5) After number input detected by raidlead:
        a) Add userclass to raid
        b) Show updated raid
        c) Show list of available userclasses 


    */



    // When done
    //showOpenRaid(message);
}

function showAvailableUserClasses(message){
    if(raid == null){
        return;
    }

    if(raid.message == null && raid.availableMembersCount == 0){
        message.channel.send("Noone has registered a class yet.");
    } else {

        var userclassesEmbed = new Discord.RichEmbed()
            .setColor('#0099ff')
            .setTitle("Verfügbare Mitglieder/Klassen")
            .setURL('https://snowcrows.com/')
            .setAuthor('FlexBot')
            .setDescription('Hier die zur Auswahl stehenden Klassen!\nWähle sie, indem du die Spieler und Klassenzahl angibst.\n Bsp. 2.4')
            .setThumbnail('https://i.imgur.com/wSTFkRM.png')


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
                        value += `(${m.numPlayer}.${m.numClass}) ${m.short} - ${m.fullname}\n`;
                    }
                });

                userclassesEmbed.addField("__**" + tag + "**__", value);       
            } 
                    
        });

        // List selected
        var members = "";
        raid.members.forEach(function (m) {
            members += `${m.tag} - ${m.short} - ${m.fullname}\n`;    
        });

        if(members == ""){
            members = "Keine Mitglieder gewählt";
        }

        userclassesEmbed.addField("Ausgewählte Mitglieder", members);   

        userclassesEmbed.setTimestamp()
        .setFooter('FlexBot v0.1', 'https://i.imgur.com/wSTFkRM.png');

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
                message.channel.send("No Userclass found with input: " + message.content); 
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
        message.channel.send(`something went wrong. No open raid could be found!`); 
    }
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
                    title: "Your command was invalid. Please use '$f me add <short>':",
                    fields: [
                        { name: "Command", value: "$f me\n$f me add\n$f me remove", inline: true},
                        { name: "Description", value: "Shows your registered classes\nAdd a new class\nRemove a class", inline: true}
                    ]}
                });
            }
        }
        
    } else {
        // Show User's classes
        db.all('SELECT u.uid AS uid,u.name AS tag,u.nick AS nick, c.class, c.name AS fullname, c.specialization AS spec, c.short AS short, c.role AS role '
                + 'FROM users AS u '
                + 'JOIN userclasses as uc ON u.id = uc.user '
                + 'JOIN classes AS c ON uc.class = c.id '
                + 'WHERE u.uid = ?',[message.member.user.id], 
        function(err, rows){
            var uids = "";
            var tags = "";
            var nicks = "";
            var classes = "";
            var fullnames = "";
            var specs = "";
            var shorts = "";
            var roles = "";
            if (err) {
                log(err.message);
                message.channel.send("Something went wrong! :(");
            }

            if(rows.length == 0){
                console.log("empteeey");
                var userclassesEmbed = new Discord.RichEmbed()
                .setColor('#0099ff')
                .setTitle(message.member.user.username + "'s Verfügbare Klassen")
                .setURL('https://snowcrows.com/')
                .setAuthor('FlexBot')
                .setDescription('Deine hinterlegten Klassen:')
                .setThumbnail('https://i.imgur.com/wSTFkRM.png')
                .addField('Keine Klassen', 'Es wurden noch keine Klassen hinterlegt.')
                .addBlankField()
                .addField('Wie hinterlege ich meine Klassen?', "Benutze den Command '$f me add <Kürzel>'. Die Kürzel findest du mit '$f classes'.")
                //.setImage('https://i.imgur.com/wSTFkRM.png')
                .setTimestamp()
                .setFooter('FlexBot v0.1', 'https://i.imgur.com/wSTFkRM.png');
                message.channel.send(userclassesEmbed);

            } else {
                rows.forEach(function (row) {
                    uids += row.uid + "\n";
                    tags +=  row.tag + "\n";
                    nicks += row.nick + "\n";
                    classes += row.class + "\n";
                    fullnames += row.fullname + "\n";
                    specs += row.spec + "\n";
                    shorts += row.short + "\n";
                    roles += row.role + "\n";
                });

                var userclassesEmbed = new Discord.RichEmbed()
                .setColor('#0099ff')
                .setTitle(message.member.user.username + "'s Verfügbare Klassen")
                .setURL('https://snowcrows.com/')
                .setAuthor('FlexBot')
                .setDescription('Deine hinterlegten Klassen:')
                .setThumbnail('https://i.imgur.com/wSTFkRM.png')
                .addField('Spezialisierung', specs, true)
                .addField('Rolle', roles, true)
                .addField('Kürzel', shorts, true)
                //.setImage('https://i.imgur.com/wSTFkRM.png')
                .setTimestamp()
                .setFooter('FlexBot v0.1', 'https://i.imgur.com/wSTFkRM.png');

                message.channel.send(userclassesEmbed);
            }

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
        var exampleEmbed = new Discord.RichEmbed()
        .setColor('#0099ff')
        .setTitle('Verfügbare Klassen')
        .setURL('https://snowcrows.com/')
        .setAuthor('FlexBot')
        .setDescription('Alle verfügbaren Klassen. Tragt eure Klassen mit "$f me add <Kürzel>" ein.')
        .setThumbnail('https://i.imgur.com/wSTFkRM.png')

        .addField('Spezialisierung', specs, true)
        .addField('Rolle', roles, true)
        .addField('Kürzel', shorts, true)
        //.setImage('https://i.imgur.com/wSTFkRM.png')
        .setTimestamp()
        .setFooter('FlexBot v0.1', 'https://i.imgur.com/wSTFkRM.png');

        message.channel.send(exampleEmbed);
    });
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