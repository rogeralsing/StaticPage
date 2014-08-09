var git = require('nodegit'),
    rimraf = require('rimraf'),
    path = "c:\\tmp";

  function foo()
  {
    rimraf(path, function() {
      git.Repo.clone("https://github.com/akkadotnet/akkadotnet.github.com.git", path, null, function(error, repo) {
        if (error) throw error;    
      });
    });
  }
