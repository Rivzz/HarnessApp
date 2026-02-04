Demonstration of AI harness 


# INITIALIZATION PHASE
-----------------------------

### First Goal
Generating test cases, allowing AI to initialize the features which it deems necessary for a user.

### Second Goal
Generation of a features_list.json which holds AI's task's in JSON syntax for easy processing of next step

### Third Goal
Generate the initial init.sh for assembly of goals list

### Fourth Goal
Scaffolding the project architecture based on the features_list.

### Fifth Goal
Initialize the repository

### Completion
Generate handoff notes in claude-progress.txt
Generate a claude.md file for workflow rules


# CREATION PHASE
------------------------------------------------
Agent will process through tasks on order of priority, AI has choice of how many it will complete in one context session (minimizing tokens and bloating) -> Allows for task assignment flexibility
Context completion updates claude-progress.txt, features_list.json, project understanding and rules are maintainted through CLAUDE.MD and task memory in claude-progress.txt

# PLANNING
------------------------------------------------
Agent tasks can be added through AI induction or manually for iterative additions without loss of context or needing to remember previous important state context 
