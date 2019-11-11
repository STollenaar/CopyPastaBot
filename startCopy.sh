    
git pull
git submodule foreach git pull origin master

SCRIPT_DIR=$(cd $(dirname "$0"); pwd)

docker-compose up -d
