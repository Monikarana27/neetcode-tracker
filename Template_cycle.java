import java.util.*;

public class Template_cycle {
static class Node { Node next; }
static boolean cyclic(Node head) {
    Node slow=head,fast=head;
    while(fast!=null && fast.next!=null) {
        slow=slow.next; fast=fast.next.next;
        if(slow==fast) return true;
    }
    return false;
}
}
