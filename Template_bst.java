import java.util.*;

public class Template_bst {
static class Node { int value; Node left,right; }
static boolean valid(Node n,long lo,long hi) {
    if(n==null) return true;
    return lo<n.value && n.value<hi
        && valid(n.left,lo,n.value) && valid(n.right,n.value,hi);
} // Call with Long.MIN_VALUE and Long.MAX_VALUE; no duplicates.

}
