rsync -r src/docs/
rsync build/contracts/*docs/

git add .
git commit -m "compiles assets for Github Pages"
git push -u origin master
