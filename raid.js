class Raid {


  constructor(leader) {
    this.leader = leader;
    this.time = "";
    this.wing = "";
    this.desc = "";
    this.availableMembers = [];
    this.members = []
    this.status = 0;
    this.message = null;
  }

 

  get membersCount() {
    return this.members.length;
  }
  addMember(member){
    this.members.push(member);
  }
  removeMember(member){
    if(members.includes(member)){
        this.members.splice(this.members.indexOf(member), 1 );
    }
  }

  get availableMembersCount() {
    return this.availableMembers.length;
  }
  addAvailableMember(member){
    this.availableMembers.push(member);
  }
  removeAvailableMember(member){
    if(this.availableMembers.includes(member)){
        this.availableMembers.splice(this.availableMembers.indexOf(member), 1 );
    }
  }

  /*selectMember(member){
  	for(var i=0; i < this.members.length; i++){
  		if(member = )
  	}
  }*/
}
module.exports = Raid;