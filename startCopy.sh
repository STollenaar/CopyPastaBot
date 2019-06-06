    
git pull

SCRIPT_DIR=$(cd $(dirname "$0"); pwd)

docker build -t copypastabot "$SCRIPT_DIR"/CopyPastaBot 

docker run --rm -t -i copypastabot
