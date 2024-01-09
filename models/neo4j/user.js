// extracts just the data from the query results

const User = (_node) => {
  Object.assign(this, _node.properties);
  if (this.id) { 
    this.id = this.id.toNumber();
  } else {
    this.id = _node.identity.low;
  };
};

export default User;