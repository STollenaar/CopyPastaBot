    
git pull

SCRIPT_DIR=$(cd $(dirname "$0"); pwd)

docker build -t copypastabot "$SCRIPT_DIR"/CopyPastaBot 

#docker run --rm --name espeakbox -d -p 8080:8080 parente/espeakbox

docker run -d --name copypastabot --rm -v copypasta:"$SCRIPT_DIR"/CopyPastaBot -t -i copypastabot
