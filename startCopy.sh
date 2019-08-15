    
git pull
git submodule foreach git pull origin master

SCRIPT_DIR=$(cd $(dirname "$0"); pwd)

docker build --rm -t copypastabot . 

#docker run --rm --name espeakbox -d -p 8080:8080 parente/espeakbox

docker run -d --restart on-failure --name copypastabot -t -i --log-driver=journald -v copypasta:/var/ copypastabot
