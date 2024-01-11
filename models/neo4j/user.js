// extracts just the data from the query results
class User {
  constructor(_node) {
    Object.assign(this, _node.properties);
    if (this.id) {
      this.id = this.id.toNumber();
    } else {
      this.id = _node.identity.low;
    }
  }
}

export default User;