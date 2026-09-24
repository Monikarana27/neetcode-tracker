import java.util.*;

public class Template_trie {
static class Trie {
    Trie[] child=new Trie[26]; boolean terminal;
    void add(String s) {
        Trie node=this;
        for(char c:s.toCharArray()) {
            int i=c-'a'; // Contract: a-z only.
            if(node.child[i]==null) node.child[i]=new Trie();
            node=node.child[i];
        }
        node.terminal=true;
    }
    boolean contains(String s) {
        Trie node=this;
        for(char c:s.toCharArray()) { node=node.child[c-'a']; if(node==null)return false; }
        return node.terminal;
    }
}
}
