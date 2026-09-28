import java.util.*;

public class Template_list {
static class Node { int value; Node next; Node(int x){value=x;} }
static Node reverse(Node head) {
    Node previous=null;
    while(head!=null) {
        Node next=head.next; // Preserve untouched suffix.
        head.next=previous; previous=head; head=next;
    }
    return previous;
}
}
