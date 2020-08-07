//main function - to sanitize object from all ids etc.
function userSharesToJSON(UserShareObj) {
  //console.log(UserShareObj);
  let shares = UserShareObj.shares.map((share) => {
    return { name: share.name, params: share.params };
  });
  return JSON.stringify(shares);
}

module.exports = { userSharesToJSON };
