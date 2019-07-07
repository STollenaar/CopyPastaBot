    
#git pull

SCRIPT_DIR=$(cd $(dirname "$0"); pwd)

docker build --rm -t copypastabot . 

#docker run --rm --name espeakbox -d -p 8080:8080 parente/espeakbox

docker run --name copypastabot --rm -t -i -v copypasta:/var/ copypastabot
