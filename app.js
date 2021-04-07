const BootBot = require("bootbot");
const bot = new BootBot({
  accessToken: "",
  verifyToken: "",
  appSecret: "",
});

const ThemeParks = require("themeparks");
const disneylandParkParis = new ThemeParks.Parks.DisneylandParisMagicKingdom();
const waltDisneyStudiosParis = new ThemeParks.Parks.DisneylandParisWaltDisneyStudios();

const _ = require("underscore");
const moment = require("moment");
const stringSimilarity = require("string-similarity");

String.prototype.capitalize = function () {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

function waitTimesReply(type, payload, chat) {
  var receivedMessage = "";
  if (type == "message") {
    receivedMessage = payload.message.text;
  } else if (type == "postback") {
    receivedMessage = payload.postback.payload;
  }
  chat.say("Un petit instant 😉").then(() => {
    var parksRides = [];
    var parksRidesNames = [];
    disneylandParkParis.GetWaitTimes().then(function (mainParkRides) {
      for (ride in mainParkRides) {
        parksRidesNames.push(mainParkRides[ride].name);
        parksRides.push(mainParkRides[ride]);
      }
      waltDisneyStudiosParis.GetWaitTimes().then(function (studiosParkRides) {
        for (ride in studiosParkRides) {
          parksRidesNames.push(studiosParkRides[ride].name);
          parksRides.push(studiosParkRides[ride]);
        }

        var requestedRideMatch = stringSimilarity.findBestMatch(
          receivedMessage,
          parksRidesNames
        );
        var matchingRides = [];

        if (requestedRideMatch.bestMatch.rating >= 0.8) {
          matchingRides.push(requestedRideMatch.bestMatch.target);
        } else if (requestedRideMatch.bestMatch.rating <= 0.2) {
          matchingRides = [];
        } else {
          var sortedRatingsMatch = _.sortBy(
            requestedRideMatch.ratings,
            "rating"
          );

          var topMatchingRides = _.filter(
            sortedRatingsMatch,
            function (rideRated) {
              return rideRated.rating >= 0.5;
            }
          );

          if (topMatchingRides.length != 0) {
            _.each(topMatchingRides, function (ride) {
              matchingRides.push(ride.target);
            });
          } else {
            var bestMatchingRides = _.last(sortedRatingsMatch, 3);
            _.each(bestMatchingRides, function (ride) {
              matchingRides.push(ride.target);
            });
          }
        }

        var requestedRideData = "";
        if (matchingRides.length == 1) {
          requestedRideData = _.find(parksRides, function (rideData) {
            return matchingRides[0] == rideData.name;
          });
          if (requestedRideData) {
            switch (requestedRideData.status) {
              case "Operating":
                if (requestedRideData.waitTime <= 15) {
                  chat.say(
                    "Le temps d'attente à " +
                      requestedRideMatch.bestMatch.target +
                      " est de " +
                      requestedRideData.waitTime +
                      " minutes 😏",
                    { typing: true }
                  );
                } else if (
                  requestedRideData.waitTime > 15 &&
                  requestedRideData.waitTime <= 45
                ) {
                  chat.say(
                    "Le temps d'attente à " +
                      requestedRideMatch.bestMatch.target +
                      " est de " +
                      requestedRideData.waitTime +
                      " minutes 🙃",
                    { typing: true }
                  );
                } else {
                  chat.say(
                    "Le temps d'attente à " +
                      requestedRideMatch.bestMatch.target +
                      " est de " +
                      requestedRideData.waitTime +
                      " minutes 😧",
                    { typing: true }
                  );
                }
                break;
              case "Refurbishment":
                chat.say(
                  requestedRideMatch.bestMatch.target +
                    " est fermé pour rénovation 😕",
                  { typing: true }
                );
                break;
              case "Down":
                chat.say(
                  requestedRideMatch.bestMatch.target +
                    " est cassé pour le moment... 😵",
                  { typing: true }
                );
                break;
              default:
                chat.say(
                  requestedRideMatch.bestMatch.target + " est fermé 😫",
                  { typing: true }
                );
            }
          } else {
            chat
              .say(
                "Doucement avec la poussière d'étoile ! ✨ Je n'ai rien compris à ce que tu me dis ! 😶"
              )
              .then(() => {
                chat.say({
                  text: "Laisses-moi te guider :",
                  buttons: [
                    {
                      type: "postback",
                      title: "Horaires",
                      payload: "PARKS_OPENINGS",
                    },
                    {
                      type: "postback",
                      title: "Liste des attractions",
                      payload: "LIST_RIDES",
                    },
                    {
                      type: "postback",
                      title: "🦄",
                      payload: "MAGIC_SURPRISE",
                    },
                  ],
                });
              });
          }
        } else if (matchingRides.length > 1) {
          var buttonsMatchingRides = [];
          _.each(matchingRides, function (rideName) {
            buttonsMatchingRides.push({
              type: "postback",
              title: rideName,
              payload: rideName,
            });
          });
          chat.say(
            {
              text:
                "Consommes de la poussière d'étoile avec modération ! ✨ Je n'ai pas compris quelle atraction tu recherchais 🤔",
              buttons: buttonsMatchingRides,
            },
            { typing: true }
          );
        } else {
          chat
            .say(
              "Doucement avec la poussière d'étoile ! ✨ Je n'ai rien compris à ce que tu me dis ! 😶"
            )
            .then(() => {
              chat.say({
                text: "Laisses-moi te guider :",
                buttons: [
                  {
                    type: "postback",
                    title: "Horaires",
                    payload: "PARKS_OPENINGS",
                  },
                  {
                    type: "postback",
                    title: "Liste des attractions",
                    payload: "LIST_RIDES",
                  },
                  // { type: 'postback', title: '🦄', payload: 'MAGIC_SURPRISE' }
                ],
              });
            });
        }
      }, console.error);
    }, console.error);
  });
}

bot.hear(
  ["Bonjour", "Salut", "Hello", "Coucou", "Hi", "Hey"],
  (payload, chat) => {
    chat.getUserProfile().then((user) => {
      chat
        .say("Salut " + user.first_name + " 😊 ", { typing: true })
        .then(() => {
          var disneylandParkOpenings = {};
          disneylandParkParis.GetOpeningTimes().then(function (times) {
            disneylandParkOpenings = times[0];
            chat
              .say(
                "Aujourd'hui le parc Disneyland est ouvert de " +
                  moment(disneylandParkOpenings.openingTime).format("HH:mm") +
                  " à " +
                  moment(disneylandParkOpenings.closingTime).format("HH:mm"),
                { typing: true }
              )
              .then(() => {
                var waltDisneyStudiosOpenings = {};
                waltDisneyStudiosParis.GetOpeningTimes().then(function (times) {
                  waltDisneyStudiosOpenings = times[0];
                  chat
                    .say(
                      "et le parc Walt Disney Studios est ouvert de " +
                        moment(waltDisneyStudiosOpenings.openingTime).format(
                          "HH:mm"
                        ) +
                        " à " +
                        moment(waltDisneyStudiosOpenings.closingTime).format(
                          "HH:mm"
                        ),
                      { typing: true }
                    )
                    .then(() => {
                      chat.say("Très belle et magique journée ! 🦄");
                    });
                });
              });
          });
        });
    });
  }
);

bot.hear(
  [
    "Au revoir",
    "Bye",
    "Good bye",
    "Bye bye",
    "See ya",
    "See you",
    "Bonne journée",
    "Bonne soirée",
  ],
  (payload, chat) => {
    chat.say("Ravi d'avoir pu t'aider ! 👍", { typing: true }).then(() => {
      chat.say("À la prochaine ! 👋", { typing: true });
    });
  }
);

bot.hear(
  ["Merci", "Thanks", "Thx", "Thank you", "Cimer", "Ok"],
  (payload, chat) => {
    chat.say("Ravi d'avoir pu t'aider ! 👍", { typing: true });
  }
);

bot.hear(
  ["Manger", "Bouffer", "J'ai faim", "J'ai la dalle", "Miam"],
  (payload, chat) => {
    chat.say("🍔🍟", { typing: true }).then(() => {
      chat.say("Bon appétit !", { typing: true }).then(() => {
        chat.say({
          attachment: "image",
          url: "https://media.giphy.com/media/13mdM8tLH2Th60/giphy.gif",
        });
      });
    });
  }
);

bot.hear(["🦄"], (payload, chat) => {
  chat.say("Un petit instant 😉").then(() => {
    var magicMusic = getRandomInt(0, 5);
    switch (magicMusic) {
      case 0:
        chat
          .say({
            attachment: "audio",
            url: "https://waitdisney.bots.kyvan.io/media/Its-a-small-world.mp3",
          })
          .then(() => {
            chat.say("🎶 IT'S A SMALL, SMALL WORLD ! 🤗", { typing: true });
          });
        break;
      case 1:
        chat
          .say({
            attachment: "audio",
            url: "https://waitdisney.bots.kyvan.io/media/Magic-everywhere.mp3",
          })
          .then(() => {
            chat.say("🎶 MAGIC EVERYWHERE ! ✨", { typing: true });
          });
        break;
      case 2:
        chat
          .say({
            attachment: "audio",
            url: "https://waitdisney.bots.kyvan.io/media/Lost-in-the-magic.mp3",
          })
          .then(() => {
            chat.say("🎶 LOST IN THE MAGIC ! YEAH ! ✨", { typing: true });
          });
        break;
      case 3:
        chat
          .say({
            attachment: "audio",
            url:
              "https://waitdisney.bots.kyvan.io/media/Just-like-we-dreamed-it.mp3",
          })
          .then(() => {
            chat.say("🎶 JUST LIKE WE DREAMED IT ! 💭", { typing: true });
          });
        break;
      case 4:
        chat
          .say({
            attachment: "audio",
            url:
              "https://waitdisney.bots.kyvan.io/media/Dancin-a-catchy-rythm.mp3",
          })
          .then(() => {
            chat.say("🎶 DANCIN A CATCHY RYTHM ! 🕺", { typing: true });
          });
        break;
      default:
        chat
          .say({
            attachment: "audio",
            url: "https://waitdisney.bots.kyvan.io/media/Its-a-small-world.mp3",
          })
          .then(() => {
            chat.say("🎶 IT'S A SMALL, SMALL WORLD ! 🤗", { typing: true });
          });
    }
  });
});

bot.hear(["☃️", "⛄️"], (payload, chat) => {
  chat.say("Un petit instant 😉").then(() => {
    chat
      .say({
        attachment: "audio",
        url:
          "https://waitdisney.bots.kyvan.io/media/Do-you-want-to-build-a-snowman.mp3",
      })
      .then(() => {
        chat.say("🎶 Do you want to build a snowman ? ⛄️", { typing: true });
      });
  });
});

bot.hear(["⛵️"], (payload, chat) => {
  chat.say("Un petit instant 😉").then(() => {
    chat
      .say({
        attachment: "audio",
        url: "https://waitdisney.bots.kyvan.io/media/How-far-ill-go.mp3",
      })
      .then(() => {
        chat.say("🎶 See the line where the sky meets the sea ? 🌅", {
          typing: true,
        });
      });
  });
});

bot.hear(["☀️", "🌸"], (payload, chat) => {
  chat.say("Un petit instant 😉").then(() => {
    chat
      .say({
        attachment: "audio",
        url: "https://waitdisney.bots.kyvan.io/media/Wind-in-my-hair.mp3",
      })
      .then(() => {
        chat.say("🎶 I got a smile on my face and I'm walking on air 💁🏼", {
          typing: true,
        });
      });
  });
});

bot.hear(["❄️"], (payload, chat) => {
  chat.say("Un petit instant 😉").then(() => {
    chat
      .say("❄️ To my best friends 👸🏼👸🏻 #MagicKingdom", { typing: true })
      .then(() => {
        chat.say("💛");
      });
  });
});

var excludedWordings = [
  "Bonjour",
  "Salut",
  "Hello",
  "Coucou",
  "Hi",
  "Hey",
  "Merci",
  "Thanks",
  "Thx",
  "Thank you",
  "Cimer",
  "Ok",
  "Au revoir",
  "Bye",
  "Good bye",
  "Bye bye",
  "See ya",
  "See you",
  "Bonne journée",
  "Bonne soirée",
  "Manger",
  "Bouffer",
  "J'ai faim",
  "J'ai la dalle",
  "Miam",
  "🦄",
  "☃️",
  "⛄️",
  "❄️",
  "⛵️",
  "☀️",
  "🌸",
];

bot.on("message", (payload, chat) => {
  if (!_.contains(excludedWordings, payload.message.text.capitalize())) {
    waitTimesReply("message", payload, chat);
  }
});

bot.on("postback", (payload, chat) => {
  if (!_.contains(excludedWordings, payload.postback.payload.capitalize())) {
    if (payload.postback.payload == "PARKS_OPENINGS") {
      chat.say("Un petit instant 😉").then(() => {
        var disneylandParkOpenings = {};
        disneylandParkParis.GetOpeningTimes().then(function (times) {
          disneylandParkOpenings = times[0];
          chat.say(
            "Le parc Disneyland est ouvert de " +
              moment(disneylandParkOpenings.openingTime).format("HH:mm") +
              " à " +
              moment(disneylandParkOpenings.closingTime).format("HH:mm"),
            { typing: true }
          );
          var waltDisneyStudiosOpenings = {};
          waltDisneyStudiosParis.GetOpeningTimes().then(function (times) {
            waltDisneyStudiosOpenings = times[0];
            chat.say(
              "et le parc Walt Disney Studios est ouvert de " +
                moment(waltDisneyStudiosOpenings.openingTime).format("HH:mm") +
                " à " +
                moment(waltDisneyStudiosOpenings.closingTime).format("HH:mm"),
              { typing: true }
            );
          });
        });
      });
    } else if (payload.postback.payload == "LIST_RIDES") {
      chat.say("Un petit instant 😉").then(() => {
        chat.say({
          text:
            "Pour quel parc souhaites-tu obtenir la liste des attractions ?",
          buttons: [
            {
              type: "postback",
              title: "Disneyland Park",
              payload: "LIST_RIDES_DLP",
            },
            {
              type: "postback",
              title: "Walt Disney Studios",
              payload: "LIST_RIDES_WDS",
            },
          ],
        });
      });
    } else if (payload.postback.payload == "LIST_RIDES_DLP") {
      var disneylandParkRidesList = [];
      disneylandParkParis
        .GetWaitTimes()
        .then(function (rides) {
          _.each(rides, function (ride) {
            disneylandParkRidesList.push(ride.name);
          });
        }, console.error)
        .then(function () {
          var ridesCount = disneylandParkRidesList.length;
          var ridesCountHalf = disneylandParkRidesList.length / 2;
          chat
            .say(
              _.initial(disneylandParkRidesList, ridesCountHalf).join(
                "\r\n▶️ "
              ),
              { typing: true }
            )
            .then(() => {
              chat
                .say(
                  _.rest(disneylandParkRidesList, ridesCountHalf).join(
                    "\r\n▶️ "
                  ),
                  { typing: true }
                )
                .then(() => {
                  chat.say(
                    "Saisis le nom de l'attraction pour laquelle tu souhaiterais obtenir le temps d'attente",
                    { typing: true }
                  );
                });
            });
        });
    } else if (payload.postback.payload == "LIST_RIDES_WDS") {
      var waltDisneyStudiosRidesList = [];
      waltDisneyStudiosParis
        .GetWaitTimes()
        .then(function (rides) {
          _.each(rides, function (ride) {
            waltDisneyStudiosRidesList.push(ride.name);
          });
        }, console.error)
        .then(function () {
          var ridesCount = waltDisneyStudiosRidesList.length;
          var ridesCountHalf = waltDisneyStudiosRidesList.length / 2;
          chat
            .say(
              _.initial(waltDisneyStudiosRidesList, ridesCountHalf).join(
                "\r\n▶️ "
              ),
              { typing: true }
            )
            .then(() => {
              chat
                .say(
                  _.rest(waltDisneyStudiosRidesList, ridesCountHalf).join(
                    "\r\n▶️ "
                  ),
                  { typing: true }
                )
                .then(() => {
                  chat.say(
                    "Saisis le nom de l'attraction pour laquelle tu souhaiterais obtenir le temps d'attente",
                    { typing: true }
                  );
                });
            });
        });
    } else if (payload.postback.payload == "MAGIC_SURPRISE") {
      chat
        .say({
          attachment: "audio",
          url: "https://waitdisney.bots.kyvan.io/media/Its-a-small-world.mp3",
        })
        .then(() => {
          chat.say("🎶 IT'S A SMALL, SMALL WORLD ! 🤗", { typing: true });
        });
    } else {
      waitTimesReply("postback", payload, chat);
    }
  }
});

bot.start("passenger");
