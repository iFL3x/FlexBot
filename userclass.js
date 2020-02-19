class UserClass {
  constructor(numPlayer, numClass, id, uid, tag, nick, clas, spec, short, fullname, role) {
    this.numPlayer = numPlayer;
    this.numClass = numClass;
    this.id = id;
    this.uid = uid;
    this.tag = tag;
    this.nick = nick;
    this.clas = clas;
    this.spec = spec;
    this.short = short;
    this.fullname = fullname;
    this.role = role;
    this.status = 0;
  }
}
module.exports = UserClass;