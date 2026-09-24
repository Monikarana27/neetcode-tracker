import java.util.*;

public class Template_tree {
static class Node { Node left,right; }
static int height(Node n,int[] diameter) {
    if(n==null) return 0;
    int l=height(n.left,diameter),r=height(n.right,diameter);
    diameter[0]=Math.max(diameter[0],l+r); // Edges through n.
    return 1+Math.max(l,r); // Height in nodes.
}
static int diameter(Node root) {
    int[] best={0}; height(root,best); return best[0];
}
}
