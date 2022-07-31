const userAgentsBase = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/%d.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:%d.0) Gecko/20100101 Firefox/%d.0"
]

class UserAgents {

  #userAgentsList = [];

  constructor() {
    const chromeRange = [55, 103];
    const ranges = [];

    for (let i = chromeRange[0]; i <= chromeRange[1]; i++) {
      ranges.push(userAgentsBase[1].replaceAll('%d', i.toString()));
    }

    this.#userAgentsList = ranges;
  }

  getRandom() {
    return this.#userAgentsList[Math.floor(Math.random() * this.#userAgentsList.length)];
  }

}

module.exports = new UserAgents();