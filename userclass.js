class UserClass {
  constructor(numPlayer, numClass, id, uid, tag, nick, clas, spec, short, role) {
    this.numPlayer = numPlayer;
    this.numClass = numClass;
    this.id = id;
    this.uid = uid;
    this.tag = tag;
    this.nick = nick;
    this.clas = clas;
    this.spec = spec;
    this.short = short;
    this.role = role;
    this.status = 0;
  }
}
module.exports = UserClass;