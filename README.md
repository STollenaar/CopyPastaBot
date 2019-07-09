# CopyPastaBot

This discord bot allows to browse reddit, post reddit posts and play a text-to-speach stream from a reddit post.

# Requirements

* Docker should be installed.
    1. If not [Download and install Docker](https://docs.docker.com/install/). The Community Edition should work just fine. 
* At this moment a Google Service Account is required for the text-to-speach functionality. 
    1. [Follow the steps here for the quickstart only.](https://github.com/googleapis/nodejs-text-to-speech#quickstart)
    2. Once you have downloaded the access keys of the service account rename it to `discordtts.json` and place it in the `src` folder.
* A reddit account and app project is needed
    1. [To register to reddit.](https://www.reddit.com/register/)
    2. [To create an app project.](https://www.reddit.com/prefs/apps/) 

# Installation

1. Once all the requirements are met run `docker create -v /var/lib/mysql --name copypasta mysql`.
2. Navigate to where you want to keep this repo and clone it.
3. Run `./startCopy.sh`.
    * The first time running will create an error since the bot isn't configured yet.
4. Future running can be done with `docker container start copypastabot` or `./startCopy.sh`. Starting it the latter way will try and use the latest version

# Configuration

At this moment this is a very tedious process and will be improved.
There are two ways to do it, trough attaching to the docker container or running commands inside it. Both ways need the container to be running.

## Attaching to the container

1. In the terminal run `docker attach copypastabot`.
2. The config can be edited/viewed by typing `config set/view <field> <value>` where the value field is only needed when you are setting the value of a field.
3. Exit the container by using `cmd+P + Q` or `Ctr+P + Q`.
    

## Running commands inside the container

1. In the terminal run `docker exec -it copypastabot sh`
2. Type `mysql`
3. Type `connect COPY_DB`
4. To edit the config values you now have to use SQL update statements like `UPDATE config SET <field>=<value>, <field2>=<value2>, .... ;`
5. Exit the container by using `cmd+P + Q` or `Ctr+P + Q`. 

### Fields

* `AuthThkn` Auth token for the discord bot. (String)
* `Debug` Boolean value if you need to test something in a private server. (Boolean)
* `DebugServer` private server ID for testing. (Integer)
* `IntervalTimeInSeconds` amount of time for when the bot checks the top posts of `/r/copypasta`. (Integer)
* `User_agent` name of the bot in the reddit api. (String)
* `Client_Id` ID of the bot in the reddit api. (String)
* `Client_Secret` secret of the bot in the reddit api. (String)
* `Username` username of a reddit account. (String)
* `Password` password of a reddit account. (String)
* `MinUpvotes` minimum upvotes a post needs to be seen in the interval time. (Integer)
* `PostLimit` amount of posts it posts every interval. (Integer)
* `MessageLimit` character limit for discord. (Integer)
* `PageSize` page size for the list command. (Integer)
* `LogOffMessages` logg off messages for when the bot stops working (not working at the moment) (Array of strings)
