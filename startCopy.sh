    
#git pull

SCRIPT_DIR=$(cd $(dirname "$0"); pwd)

docker build -t copypastabot . 

#docker run --rm --name espeakbox -d -p 8080:8080 parente/espeakbox

docker run --name copypastabot --rm -v copypasta:/var/ -t -i copypastabot
